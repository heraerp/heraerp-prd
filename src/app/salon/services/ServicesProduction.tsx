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
  Scissors, 
  Plus,
  Edit3,
  Trash2,
  Clock,
  DollarSign,
  User,
  Search,
  Sparkles,
  ArrowLeft,
  Star,
  Users,
  Timer,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

const categories = [
  'Hair Services',
  'Color Services',
  'Men\'s Services', 
  'Hair Treatments',
  'Special Occasions',
  'Styling Services'
]

interface Service {
  id: string
  entity_name: string
  entity_type: string
  entity_code?: string
  organization_id: string
  smart_code?: string
  created_at?: string
  updated_at?: string
  // Dynamic fields
  category?: string
  duration?: number
  price?: number
  description?: string
  available_stylists?: string[]
  popularity?: number
  bookings?: number
  average_rating?: number
  is_active?: boolean
}

export default function ServicesProduction() {
  const { organization } = useAuth()
  const organizationId = organization?.id
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [stylists, setStylists] = useState<string[]>([])
  
  // Debug log
  console.log('ServicesProduction render:', { organizationId, organization })

  // New service form state
  const [newService, setNewService] = useState({
    name: '',
    category: '',
    duration: 60,
    price: 0,
    description: '',
    availableStylists: [] as string[]
  })

  // Set organization ID for API
  useEffect(() => {
    if (organizationId) {
      universalApi.setOrganizationId(organizationId)
    }
  }, [organizationId])

  // Load stylists from employee entities
  const loadStylists = async () => {
    if (!organizationId) return
    
    try {
      // Get all employee entities that are stylists
      const response = await universalApi.read('core_entities', {
        entity_type: 'employee',
        organization_id: organizationId
      })

      if (response.success && response.data) {
        // Filter for active stylists in hair/styling departments
        const stylistNames = await Promise.all(
          response.data.map(async (entity: any) => {
            const dynamicData = await universalApi.getDynamicFields(entity.id)
            const status = dynamicData.status || 'active'
            const department = dynamicData.department || ''
            
            // Only include active staff from relevant departments
            if (status === 'active' && 
                (department === 'Hair Services' || 
                 department === "Men's Grooming" ||
                 department === '' ||  // Include if no department specified
                 dynamicData.role?.toLowerCase().includes('stylist') ||
                 dynamicData.role?.toLowerCase().includes('barber'))) {
              return entity.entity_name
            }
            return null
          })
        )
        
        // Filter out nulls and set the stylists
        const activeStylists = stylistNames.filter(name => name !== null) as string[]
        console.log('Loaded stylists:', activeStylists)
        setStylists(activeStylists)
      }
    } catch (error) {
      console.error('Error loading stylists:', error)
      // Don't show error to user, just continue without stylists
    }
  }

  // Load services from Supabase
  const loadServices = async () => {
    if (!organizationId) return
    
    setLoading(true)
    try {
      // Get all service entities
      const response = await universalApi.read('core_entities', {
        entity_type: 'service',
        organization_id: organizationId
      })

      if (response.success && response.data) {
        // For each service, load dynamic data
        const servicesWithData = await Promise.all(
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
              category: dynamicData.category || '',
              duration: parseInt(dynamicData.duration || '60'),
              price: parseFloat(dynamicData.price || '0'),
              description: dynamicData.description || '',
              available_stylists: dynamicData.available_stylists ? JSON.parse(dynamicData.available_stylists) : [],
              popularity: parseInt(dynamicData.popularity || '0'),
              bookings: parseInt(dynamicData.bookings || '0'),
              average_rating: parseFloat(dynamicData.average_rating || '0'),
              is_active: dynamicData.is_active !== 'false'
            }
          })
        )

        setServices(servicesWithData)
      }
    } catch (error) {
      console.error('Error loading services:', error)
      toast({
        title: 'Error',
        description: 'Failed to load services. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Load services and stylists on mount
  useEffect(() => {
    loadServices()
    loadStylists()
  }, [organizationId])

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
    return matchesSearch && matchesCategory && service.is_active !== false
  })

  const handleAddService = async () => {
    console.log('handleAddService called', { newService, organizationId })
    
    if (!newService.name || !newService.category || !organizationId) {
      console.log('Validation failed:', { 
        name: newService.name, 
        category: newService.category, 
        organizationId 
      })
      if (!newService.name) {
        toast({
          title: 'Error',
          description: 'Please enter a service name',
          variant: 'destructive'
        })
      }
      if (!newService.category) {
        toast({
          title: 'Error',
          description: 'Please select a category',
          variant: 'destructive'
        })
      }
      return
    }

    setSaving(true)
    try {
      console.log('Creating service entity...')
      // Create service entity
      const entityResponse = await universalApi.createEntity({
        entity_type: 'service',
        entity_name: newService.name,
        entity_code: `SERVICE-${Date.now()}`,
        organization_id: organizationId,
        smart_code: 'HERA.SALON.SERVICE.v1'
      })
      
      console.log('Entity response:', entityResponse)

      if (entityResponse.success && entityResponse.data) {
        const entityId = entityResponse.data.id

        // Set dynamic fields
        const dynamicFields = {
          category: newService.category,
          duration: newService.duration.toString(),
          price: newService.price.toString(),
          description: newService.description,
          available_stylists: JSON.stringify(newService.availableStylists),
          popularity: '0',
          bookings: '0',
          average_rating: '0',
          is_active: 'true'
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
          description: 'Service added successfully!',
          duration: 3000
        })

        // Reset form
        setNewService({
          name: '',
          category: '',
          duration: 60,
          price: 0,
          description: '',
          availableStylists: []
        })
        setShowAddForm(false)

        // Reload services
        await loadServices()
      }
    } catch (error) {
      console.error('Error adding service:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add service. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      // Soft delete by setting is_active to false
      await universalApi.setDynamicField(id, 'is_active', 'false')
      
      toast({
        title: 'Success',
        description: 'Service deleted successfully!',
        duration: 3000
      })
      
      setSelectedService(null)
      await loadServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete service. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Hair Services': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Color Services': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Men\'s Services': return 'bg-green-100 text-green-800 border-green-200'
      case 'Hair Treatments': return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'Special Occasions': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getServiceStats = () => {
    const activeServices = services.filter(s => s.is_active !== false)
    return {
      totalServices: activeServices.length,
      totalRevenue: activeServices.reduce((sum, s) => sum + ((s.bookings || 0) * (s.price || 0)), 0),
      totalBookings: activeServices.reduce((sum, s) => sum + (s.bookings || 0), 0),
      averagePrice: activeServices.length > 0 
        ? Math.round(activeServices.reduce((sum, s) => sum + (s.price || 0), 0) / activeServices.length)
        : 0,
      topService: activeServices.sort((a, b) => (b.bookings || 0) - (a.bookings || 0))[0]?.entity_name || 'N/A'
    }
  }

  const serviceStats = getServiceStats()

  if (loading && services.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading services...</p>
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
                    Service Management
                  </h1>
                  <p className="text-sm text-gray-600">Manage your service catalog and pricing</p>
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
          {/* Service Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Scissors className="h-8 w-8 mx-auto mb-2 text-pink-500" />
                  <p className="text-2xl font-bold text-pink-600">{serviceStats.totalServices}</p>
                  <p className="text-xs text-gray-600">Active Services</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">${serviceStats.totalRevenue}</p>
                  <p className="text-xs text-gray-600">Total Revenue</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-600">{serviceStats.totalBookings}</p>
                  <p className="text-xs text-gray-600">Total Bookings</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold text-purple-600">${serviceStats.averagePrice}</p>
                  <p className="text-xs text-gray-600">Avg Price</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-lg font-bold text-yellow-600">{serviceStats.topService}</p>
                  <p className="text-xs text-gray-600">Most Popular</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search services by name or description..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="hera-select-item">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Services List */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5 text-pink-500" />
                    Services ({filteredServices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredServices.map((service) => (
                      <div 
                        key={service.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${ 
                          selectedService?.id === service.id 
                            ? 'border-pink-300 bg-pink-50' 
                            : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                        }`}
                        onClick={() => setSelectedService(service)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                              <Scissors className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{service.entity_name}</p>
                                <Badge className={getCategoryColor(service.category || '')}>
                                  {service.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {service.duration}min
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {service.bookings} bookings
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {service.average_rating}/5
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">${service.price}</p>
                            <p className="text-xs text-gray-500">{service.popularity}% popular</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Service Details / Add Form */}
            <div>
              {showAddForm ? (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-pink-500" />
                      Add New Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Service Name *</Label>
                      <Input
                        id="name"
                        value={newService.name}
                        onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter service name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={newService.category}
                        onValueChange={(value) => setNewService(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          {categories.map((category) => (
                            <SelectItem key={category} value={category} className="hera-select-item">
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={newService.duration}
                        onChange={(e) => setNewService(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newService.price}
                        onChange={(e) => setNewService(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        placeholder="85.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newService.description}
                        onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the service..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Available Stylists</Label>
                      {stylists.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {stylists.map((stylist) => (
                            <label key={stylist} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={newService.availableStylists.includes(stylist)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewService(prev => ({
                                      ...prev,
                                      availableStylists: [...prev.availableStylists, stylist]
                                    }))
                                  } else {
                                    setNewService(prev => ({
                                      ...prev,
                                      availableStylists: prev.availableStylists.filter(s => s !== stylist)
                                    }))
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="text-sm">{stylist}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No stylists found. Please add staff members first.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAddService}
                        className="flex-1 bg-pink-600 hover:bg-pink-700"
                        disabled={!newService.name || !newService.category || saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Service
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
              ) : selectedService ? (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Scissors className="h-5 w-5 text-pink-500" />
                        Service Details
                      </CardTitle>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteService(selectedService.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center pb-4 border-b">
                      <div className="h-16 w-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Scissors className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg">{selectedService.entity_name}</h3>
                      <Badge className={getCategoryColor(selectedService.category || '')}>
                        {selectedService.category}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">{selectedService.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                          <p className="font-semibold text-blue-600">{selectedService.duration}min</p>
                          <p className="text-xs text-gray-600">Duration</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                          <p className="font-semibold text-green-600">${selectedService.price}</p>
                          <p className="text-xs text-gray-600">Price</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <Users className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                          <p className="font-semibold text-purple-600">{selectedService.bookings}</p>
                          <p className="text-xs text-gray-600">Bookings</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <Star className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                          <p className="font-semibold text-yellow-600">{selectedService.average_rating}</p>
                          <p className="text-xs text-gray-600">Rating</p>
                        </div>
                      </div>

                      {selectedService.available_stylists && selectedService.available_stylists.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Available Stylists</Label>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedService.available_stylists.map((stylist, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {stylist}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <Scissors className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Select a service to view details</p>
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Service
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