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
  Save,
  TestTube,
  Star,
  Users,
  Timer,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

// Progressive Demo Data
const initialServices = [
  {
    id: 1,
    name: 'Haircut & Style',
    category: 'Hair Services',
    duration: 60,
    price: 85,
    description: 'Professional haircut with styling, includes wash and blow-dry',
    availableStylists: ['Emma', 'David', 'Alex'],
    popularity: 95,
    bookings: 124,
    averageRating: 4.8,
    isActive: true
  },
  {
    id: 2,
    name: 'Hair Color',
    category: 'Color Services',
    duration: 120,
    price: 150,
    description: 'Full hair coloring service with consultation and aftercare',
    availableStylists: ['Emma', 'Sarah'],
    popularity: 87,
    bookings: 89,
    averageRating: 4.9,
    isActive: true
  },
  {
    id: 3,
    name: 'Beard Trim',
    category: 'Men\'s Services',
    duration: 30,
    price: 35,
    description: 'Professional beard trimming and shaping',
    availableStylists: ['David', 'Alex', 'Michael'],
    popularity: 76,
    bookings: 156,
    averageRating: 4.7,
    isActive: true
  },
  {
    id: 4,
    name: 'Highlights',
    category: 'Color Services',
    duration: 90,
    price: 130,
    description: 'Foil highlights with toner and styling',
    availableStylists: ['Emma', 'Sarah'],
    popularity: 82,
    bookings: 67,
    averageRating: 4.6,
    isActive: true
  },
  {
    id: 5,
    name: 'Deep Conditioning Treatment',
    category: 'Hair Treatments',
    duration: 45,
    price: 65,
    description: 'Intensive hair treatment for damaged or dry hair',
    availableStylists: ['Emma', 'Sarah', 'Alex'],
    popularity: 68,
    bookings: 45,
    averageRating: 4.5,
    isActive: true
  },
  {
    id: 6,
    name: 'Wedding Package',
    category: 'Special Occasions',
    duration: 150,
    price: 250,
    description: 'Complete bridal styling package including trial session',
    availableStylists: ['Emma'],
    popularity: 92,
    bookings: 12,
    averageRating: 5.0,
    isActive: true
  }
]

const categories = [
  'Hair Services',
  'Color Services',
  'Men\'s Services', 
  'Hair Treatments',
  'Special Occasions',
  'Styling Services'
]

const stylists = ['Emma', 'David', 'Alex', 'Sarah', 'Michael']

interface Service {
  id: number
  name: string
  category: string
  duration: number
  price: number
  description: string
  availableStylists: string[]
  popularity: number
  bookings: number
  averageRating: number
  isActive: boolean
}

export default function ServicesProgressive() {
  const [testMode, setTestMode] = useState(true)
  const [services, setServices] = useState<Service[]>(initialServices)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // New service form state
  const [newService, setNewService] = useState({
    name: '',
    category: '',
    duration: 60,
    price: 0,
    description: '',
    availableStylists: [] as string[]
  })

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
    return matchesSearch && matchesCategory && service.isActive
  })

  const handleSaveProgress = () => {
    setLastSaved(new Date())
    setHasChanges(false)
    console.log('Services data saved:', services)
  }

  const handleAddService = () => {
    if (!newService.name || !newService.category) return

    const service: Service = {
      id: Date.now(),
      ...newService,
      popularity: 0,
      bookings: 0,
      averageRating: 0,
      isActive: true
    }

    setServices(prev => [...prev, service])
    setNewService({
      name: '',
      category: '',
      duration: 60,
      price: 0,
      description: '',
      availableStylists: []
    })
    setShowAddForm(false)
    setHasChanges(true)
  }

  const handleDeleteService = (id: number) => {
    setServices(prev => prev.map(service => 
      service.id === id ? { ...service, isActive: false } : service
    ))
    setHasChanges(true)
    setSelectedService(null)
  }

  const handleUpdateService = (id: number, updates: Partial<Service>) => {
    setServices(prev => prev.map(service =>
      service.id === id ? { ...service, ...updates } : service
    ))
    setHasChanges(true)
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
    const activeServices = services.filter(s => s.isActive)
    return {
      totalServices: activeServices.length,
      totalRevenue: activeServices.reduce((sum, s) => sum + (s.bookings * s.price), 0),
      totalBookings: activeServices.reduce((sum, s) => sum + s.bookings, 0),
      averagePrice: Math.round(activeServices.reduce((sum, s) => sum + s.price, 0) / activeServices.length),
      topService: activeServices.sort((a, b) => b.bookings - a.bookings)[0]?.name || 'N/A'
    }
  }

  const stats = getServiceStats()

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
                  Service Management
                </h1>
                <p className="text-sm text-gray-600">Manage your service catalog and pricing</p>
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
        {/* Service Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <Scissors className="h-8 w-8 mx-auto mb-2 text-pink-500" />
                <p className="text-2xl font-bold text-pink-600">{stats.totalServices}</p>
                <p className="text-xs text-gray-600">Active Services</p>
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
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
                <p className="text-xs text-gray-600">Total Bookings</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold text-purple-600">${stats.averagePrice}</p>
                <p className="text-xs text-gray-600">Avg Price</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-lg font-bold text-yellow-600">{stats.topService}</p>
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
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
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
                              <p className="font-medium">{service.name}</p>
                              <Badge className={getCategoryColor(service.category)}>
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
                                {service.averageRating}/5
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
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
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
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddService}
                      className="flex-1 bg-pink-600 hover:bg-pink-700"
                      disabled={!newService.name || !newService.category}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
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
                    <h3 className="font-semibold text-lg">{selectedService.name}</h3>
                    <Badge className={getCategoryColor(selectedService.category)}>
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
                        <p className="font-semibold text-yellow-600">{selectedService.averageRating}</p>
                        <p className="text-xs text-gray-600">Rating</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Available Stylists</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedService.availableStylists.map((stylist, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {stylist}
                          </Badge>
                        ))}
                      </div>
                    </div>
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

        {/* Progressive Features Notice */}
        {testMode && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TestTube className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Test Mode Active</p>
                  <p className="text-sm text-blue-700">
                    Add, edit, and manage services freely. View booking statistics and stylist assignments. 
                    All changes are saved locally in test mode. Click "Save Progress" to persist your service catalog.
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