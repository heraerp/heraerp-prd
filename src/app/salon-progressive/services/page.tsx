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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Teams-Style Sidebar */}
      <SalonTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Enterprise Glassmorphism Header */}
        <div className="bg-white/20 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-black/5">
          <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild className="bg-white/80 text-slate-800 border-slate-300 hover:bg-white shadow-md font-semibold">
                <Link href="/salon-progressive">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Service Management
                </h1>
                <p className="text-sm text-slate-700 font-medium">Manage your service catalog and pricing</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Enterprise Controls */}
              <div className="flex items-center gap-3 bg-white/30 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg shadow-black/5">
                {testMode && hasChanges && (
                  <Button
                    size="sm"
                    onClick={handleSaveProgress}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md font-medium"
                  >
                    <Save className="h-4 w-4" />
                    Save Progress
                  </Button>
                )}
              </div>

              {lastSaved && (
                <div className="text-xs text-slate-600 font-medium bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                  Saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}

              <Badge className="px-3 py-1 font-medium border bg-amber-500/20 text-amber-800 border-amber-500/30">
                <div className="w-2 h-2 rounded-full mr-2 bg-amber-500"></div>
                <TestTube className="h-3 w-3 mr-1" />
                Demo Mode
              </Badge>
            </div>
          </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 space-y-8">
        {/* Enterprise Service Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl shadow-pink-500/10 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="relative mx-auto mb-3">
                  <div className="absolute inset-0 bg-pink-500/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <Scissors className="h-10 w-10 text-pink-600 relative drop-shadow-sm mx-auto" />
                </div>
                <p className="text-3xl font-bold text-pink-700 tracking-tight mb-1">{stats.totalServices}</p>
                <p className="text-sm text-slate-600 font-medium">Active Services</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="relative mx-auto mb-3">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <DollarSign className="h-10 w-10 text-emerald-600 relative drop-shadow-sm mx-auto" />
                </div>
                <p className="text-3xl font-bold text-emerald-700 tracking-tight mb-1">${stats.totalRevenue}</p>
                <p className="text-sm text-slate-600 font-medium">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="relative mx-auto mb-3">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <Users className="h-10 w-10 text-blue-600 relative drop-shadow-sm mx-auto" />
                </div>
                <p className="text-3xl font-bold text-blue-700 tracking-tight mb-1">{stats.totalBookings}</p>
                <p className="text-sm text-slate-600 font-medium">Total Bookings</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="relative mx-auto mb-3">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <TrendingUp className="h-10 w-10 text-purple-600 relative drop-shadow-sm mx-auto" />
                </div>
                <p className="text-3xl font-bold text-purple-700 tracking-tight mb-1">${stats.averagePrice}</p>
                <p className="text-sm text-slate-600 font-medium">Avg Price</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="relative mx-auto mb-3">
                  <div className="absolute inset-0 bg-amber-500/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <Star className="h-10 w-10 text-amber-600 relative drop-shadow-sm mx-auto" />
                </div>
                <p className="text-lg font-bold text-amber-700 tracking-tight mb-1">{stats.topService}</p>
                <p className="text-sm text-slate-600 font-medium">Most Popular</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enterprise Search and Filters */}
        <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                <Input
                  placeholder="Search services by name or description..."
                  className="pl-10 bg-white/60 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus:bg-white/80 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 bg-white/60 backdrop-blur-sm border-white/30 text-slate-800 hover:bg-white/80 transition-all">
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
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Services List */}
          <div className="lg:col-span-2">
            <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <div className="p-2 bg-pink-500/20 rounded-lg">
                    <Scissors className="h-6 w-6 text-pink-600" />
                  </div>
                  <span className="text-lg font-semibold">Services ({filteredServices.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredServices.map((service) => (
                    <div 
                      key={service.id} 
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 group ${ 
                        selectedService?.id === service.id 
                          ? 'bg-gradient-to-r from-pink-50/80 to-purple-50/80 border border-pink-300/50 shadow-lg backdrop-blur-sm' 
                          : 'bg-white/50 backdrop-blur-sm border border-white/30 hover:bg-white/70 hover:border-pink-300/30 hover:shadow-lg'
                      }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative">
                            <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-md group-hover:blur-lg transition-all"></div>
                            <div className="h-12 w-12 bg-gradient-to-br from-pink-500/90 to-purple-600/90 rounded-full flex items-center justify-center shadow-lg relative">
                              <Scissors className="h-6 w-6 text-white drop-shadow-sm" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-slate-800">{service.name}</p>
                              <Badge className={getCategoryColor(service.category)}>
                                {service.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-2 font-medium leading-relaxed">{service.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="h-3 w-3" />
                                {service.duration}min
                              </span>
                              <span className="flex items-center gap-1 font-medium">
                                <Users className="h-3 w-3" />
                                {service.bookings} bookings
                              </span>
                              <span className="flex items-center gap-1 font-medium">
                                <Star className="h-3 w-3" />
                                {service.averageRating}/5
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-700 tracking-tight">${service.price}</p>
                          <p className="text-xs text-slate-600 font-medium">{service.popularity}% popular</p>
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
              <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-slate-800">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Plus className="h-6 w-6 text-pink-600" />
                    </div>
                    <span className="text-lg font-semibold">Add New Service</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-slate-700 font-medium">Service Name *</Label>
                    <Input
                      id="name"
                      value={newService.name}
                      onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter service name"
                      className="bg-white/60 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus:bg-white/80 transition-all"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-slate-700 font-medium">Category *</Label>
                    <Select
                      value={newService.category}
                      onValueChange={(value) => setNewService(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="bg-white/60 backdrop-blur-sm border-white/30 text-slate-800 hover:bg-white/80 transition-all">
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
                    <Label htmlFor="duration" className="text-slate-700 font-medium">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newService.duration}
                      onChange={(e) => setNewService(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      placeholder="60"
                      className="bg-white/60 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus:bg-white/80 transition-all"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price" className="text-slate-700 font-medium">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="85.00"
                      step="0.01"
                      className="bg-white/60 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus:bg-white/80 transition-all"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-slate-700 font-medium">Description</Label>
                    <Textarea
                      id="description"
                      value={newService.description}
                      onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the service..."
                      rows={3}
                      className="bg-white/60 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus:bg-white/80 transition-all resize-none"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-700 font-medium">Available Stylists</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {stylists.map((stylist) => (
                        <label key={stylist} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/40 transition-colors cursor-pointer">
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
                            className="rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                          />
                          <span className="text-sm text-slate-700 font-medium">{stylist}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleAddService}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                      disabled={!newService.name || !newService.category}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                      className="bg-white/60 backdrop-blur-sm border-white/30 text-slate-700 hover:bg-white/80 transition-all font-medium"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedService ? (
              <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-slate-800">
                      <div className="p-2 bg-pink-500/20 rounded-lg">
                        <Scissors className="h-6 w-6 text-pink-600" />
                      </div>
                      <span className="text-lg font-semibold">Service Details</span>
                    </CardTitle>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteService(selectedService.id)}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center pb-4 border-b border-white/20">
                    <div className="relative mx-auto mb-3">
                      <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-lg"></div>
                      <div className="h-16 w-16 bg-gradient-to-br from-pink-500/90 to-purple-600/90 rounded-full flex items-center justify-center shadow-xl relative">
                        <Scissors className="h-8 w-8 text-white drop-shadow-sm" />
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 mb-2">{selectedService.name}</h3>
                    <Badge className={getCategoryColor(selectedService.category)}>
                      {selectedService.category}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-slate-700 leading-relaxed font-medium bg-white/30 backdrop-blur-sm rounded-lg p-3">{selectedService.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/40 transition-all">
                        <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2 drop-shadow-sm" />
                        <p className="font-bold text-blue-700 text-lg">{selectedService.duration}min</p>
                        <p className="text-xs text-slate-600 font-medium">Duration</p>
                      </div>
                      <div className="text-center p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/40 transition-all">
                        <DollarSign className="h-8 w-8 text-emerald-600 mx-auto mb-2 drop-shadow-sm" />
                        <p className="font-bold text-emerald-700 text-lg">${selectedService.price}</p>
                        <p className="text-xs text-slate-600 font-medium">Price</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/40 transition-all">
                        <Users className="h-8 w-8 text-purple-600 mx-auto mb-2 drop-shadow-sm" />
                        <p className="font-bold text-purple-700 text-lg">{selectedService.bookings}</p>
                        <p className="text-xs text-slate-600 font-medium">Bookings</p>
                      </div>
                      <div className="text-center p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/40 transition-all">
                        <Star className="h-8 w-8 text-amber-600 mx-auto mb-2 drop-shadow-sm" />
                        <p className="font-bold text-amber-700 text-lg">{selectedService.averageRating}</p>
                        <p className="text-xs text-slate-600 font-medium">Rating</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-slate-700 mb-2 block">Available Stylists</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedService.availableStylists.map((stylist, index) => (
                          <Badge key={index} className="text-xs bg-white/40 backdrop-blur-sm text-slate-700 border-white/30 font-medium px-3 py-1">
                            {stylist}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="relative mx-auto mb-4">
                    <div className="absolute inset-0 bg-slate-300/20 rounded-full blur-md"></div>
                    <Scissors className="h-12 w-12 mx-auto text-slate-400 relative drop-shadow-sm" />
                  </div>
                  <p className="text-slate-600 mb-6 font-medium">Select a service to view details</p>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
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
          <Card className="mt-8 bg-white/30 backdrop-blur-xl border border-white/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <TestTube className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">Demo Mode Active</p>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed mt-1">
                    Add, edit, and manage services freely. View booking statistics and stylist assignments. 
                    All changes are saved locally in demo mode. Click "Save Progress" to persist your service catalog.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enterprise HERA Technology Footer */}
        <div className="mt-12 mb-8">
          <Card className="bg-white/25 backdrop-blur-xl border border-white/15 shadow-lg">
            <CardContent className="px-8 py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gradient-to-br from-indigo-500/80 to-purple-600/80 rounded-lg flex items-center justify-center shadow-md">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-bold text-slate-800">
                        Powered by <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-black">HERA</span>
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        Universal Enterprise Resource Architecture
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-slate-400" />
                    <span className="font-medium">Patent Pending Technology</span>
                  </div>
                  <div className="hidden sm:block w-1 h-1 bg-slate-400 rounded-full"></div>
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-slate-400" />
                    <span className="font-medium">Enterprise Grade</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  )
}